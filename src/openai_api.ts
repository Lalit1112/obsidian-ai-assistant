import { MarkdownView, Notice, request } from "obsidian";

import { OpenAI } from "openai";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

import { DEFAULT_OAI_IMAGE_MODEL, OAI_IMAGE_CAPABLE_MODELS } from "./settings";

export class OpenAIAssistant {
	modelName: string;
	apiFun: any;
	maxTokens: number;
	apiKey: string;

	constructor(apiKey: string, modelName: string, maxTokens: number) {
		this.apiFun = new OpenAI({
			apiKey: apiKey,
			dangerouslyAllowBrowser: true,
		});
		this.modelName = modelName;
		this.maxTokens = maxTokens;
		this.apiKey = apiKey;
	}

	display_error = (err: any) => {
		if (err instanceof OpenAI.APIError) {
			new Notice(`## OpenAI API Error: ${err}.`);
		} else {
			new Notice(err);
		}
	};

	text_api_call = async (
		prompt_list: { [key: string]: string }[],
		htmlEl?: HTMLElement,
		view?: MarkdownView,
	) => {
		const streamMode = htmlEl !== undefined;
		const has_img = prompt_list.some((el) => Array.isArray(el.content));
		let model = this.modelName;

		if (has_img && !OAI_IMAGE_CAPABLE_MODELS.includes(model)) {
			model = DEFAULT_OAI_IMAGE_MODEL;
		}
		try {
			const is_reasonning_model = /o[124]/.test(model) || model.startsWith("gpt-5");
			const params = {
				messages: prompt_list,
				model: model,
				stream: streamMode,
				...(is_reasonning_model
					? { max_completion_tokens: this.maxTokens }
					: { max_tokens: this.maxTokens }),
			};

			const response = await this.apiFun.chat.completions.create(params);

			if (streamMode) {
				let responseText = "";
				for await (const chunk of response) {
					const content = chunk.choices[0].delta.content;
					if (content) {
						responseText = responseText.concat(content);
						htmlEl.innerHTML = responseText;
					}
				}
				return htmlEl.innerHTML;
			} else {
				return response.choices[0].message.content;
			}
		} catch (err) {
			this.display_error(err);
		}
	};

	img_api_call = async (
		model: string,
		prompt: string,
		img_size: string,
		num_img: number,
		is_hd: boolean,
	) => {
		try {
			const params: { [key: string]: string | number } = {};
			params.model = model;
			params.prompt = prompt;
			params.n = num_img;
			params.size = img_size;

			if (model === "dall-e-3" && is_hd) {
				params.quality = "hd";
			}

			const response = await this.apiFun.images.generate(params);
			return response.data.map((x: any) => x.url);
		} catch (err) {
			this.display_error(err);
		}
	};

	whisper_api_call = async (input: Blob, language: string) => {
		try {
			const completion = await this.apiFun.audio.transcriptions.create({
				file: input,
				model: "whisper-1",
				language: language,
			});
			return completion.text;
		} catch (err) {
			this.display_error(err);
		}
	};

	text_to_speech_call = async (input_text: string) => {
		try {
			const mp3 = await this.apiFun.audio.speech.create({
				model: "tts-1",
				voice: "alloy",
				input: input_text,
			});

			const blob = new Blob([await mp3.arrayBuffer()], {
				type: "audio/mp3",
			});
			const url = URL.createObjectURL(blob);
			const audio = new Audio(url);

			await audio.play();
		} catch (err) {
			this.display_error(err);
		}
	};
}

export class AnthropicAssistant extends OpenAIAssistant {
	anthropicApiKey: string;

	constructor(
		openAIapiKey: string,
		anthropicApiKey: string,
		modelName: string,
		maxTokens: number,
	) {
		super(openAIapiKey, modelName, maxTokens);

		this.anthropicApiKey = anthropicApiKey;
	}

	text_api_call = async (
		prompt_list: { [key: string]: string }[],
		htmlEl?: HTMLElement,
		view?: MarkdownView,
	) => {
		try {
			const response = await request({
				url: "https://api.anthropic.com/v1/messages",

				method: "POST",

				headers: {
					"x-api-key": this.anthropicApiKey,
					"anthropic-version": "2023-06-01",
					"content-type": "application/json",
				},
				body: JSON.stringify({
					model: this.modelName,
					max_tokens: this.maxTokens,
					messages: prompt_list,
					// Stream mode not implemented yet.
					stream: false,
				}),
			});

			return JSON.parse(response).content[0].text;
		} catch (err) {
			this.display_error(err);
		}
	};
}

export class GeminiAssistant extends OpenAIAssistant {
	geminiApiKey: string;
	genAI: GoogleGenAI;

	constructor(
		openAIapiKey: string,
		geminiApiKey: string,
		modelName: string,
		maxTokens: number,
	) {
		super(openAIapiKey, modelName, maxTokens);

		this.geminiApiKey = geminiApiKey;
		this.genAI = new GoogleGenAI({ apiKey: geminiApiKey });
	}

	display_error = (err: any) => {
		new Notice(`## Gemini API Error: ${err}.`);
	};

	text_api_call = async (
		prompt_list: { [key: string]: string }[],
		htmlEl?: HTMLElement,
		view?: MarkdownView,
	) => {
		try {
			// Convert messages to Gemini format
			const prompt = prompt_list.map(msg => msg.content).join('\n');

			const response = await this.genAI.models.generateContent({
				model: this.modelName,
				contents: prompt,
			});

			return response.text;
		} catch (err) {
			this.display_error(err);
		}
	};
}

export class GroqAssistant extends OpenAIAssistant {
	groqApiKey: string;
	groqClient: Groq;

	constructor(
		openAIapiKey: string,
		groqApiKey: string,
		modelName: string,
		maxTokens: number,
	) {
		super(openAIapiKey, modelName, maxTokens);

		this.groqApiKey = groqApiKey;
		this.groqClient = new Groq({
			apiKey: groqApiKey,
			dangerouslyAllowBrowser: true,
		});
	}

	display_error = (err: any) => {
		console.error("Groq API Error:", err);
		if (err.response) {
			console.error("Response data:", err.response.data);
			console.error("Response status:", err.response.status);
			new Notice(`Groq API Error (${err.response.status}): ${err.response.data?.error?.message || err.message}`);
		} else if (err.message) {
			new Notice(`Groq API Error: ${err.message}`);
		} else {
			new Notice(`Groq API Error: ${JSON.stringify(err)}`);
		}
	};

	isReasoningModel = (modelName: string): boolean => {
		return modelName.includes("deepseek") || modelName.includes("qwen");
	};

	filterReasoningContent = (response: string): string => {
		if (!response) return response;

		// Remove thinking tags and content between them
		let cleanedResponse = response.replace(/<think>[\s\S]*?<\/think>/gi, '');
		
		// Remove other common reasoning markers
		cleanedResponse = cleanedResponse.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
		cleanedResponse = cleanedResponse.replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, '');
		
		// Remove empty lines and trim
		cleanedResponse = cleanedResponse.replace(/^\s*[\r\n]/gm, '').trim();
		
		console.log("🧠 Filtered reasoning content from response");
		return cleanedResponse;
	};

	text_api_call = async (
		prompt_list: { [key: string]: string }[],
		htmlEl?: HTMLElement,
		view?: MarkdownView,
	) => {
		console.log("🔧 Groq API Call Debug Info:");
		console.log("Model:", this.modelName);
		console.log("Max Tokens:", this.maxTokens);
		console.log("API Key (first 10 chars):", this.groqApiKey ? this.groqApiKey.substring(0, 10) + "..." : "NOT SET");
		console.log("Messages:", prompt_list);
		console.log("Stream mode:", htmlEl !== undefined);

		if (!this.groqApiKey || this.groqApiKey.trim() === "") {
			const errorMsg = "Groq API key is not set! Please add your API key in plugin settings.";
			console.error(errorMsg);
			new Notice(errorMsg);
			return "Error: Groq API key not configured";
		}

		try {
			const streamMode = htmlEl !== undefined;
			const isReasoning = this.isReasoningModel(this.modelName);
			console.log("🧠 Is reasoning model:", isReasoning);
			new Notice(`🚀 Calling Groq with ${this.modelName}...`);

			if (streamMode) {
				console.log("Starting streaming response...");
				const response = await this.groqClient.chat.completions.create({
					messages: prompt_list as any,
					model: this.modelName,
					max_tokens: this.maxTokens,
					stream: true,
				});

				let responseText = "";
				for await (const chunk of response) {
					const content = chunk.choices[0]?.delta?.content;
					if (content) {
						responseText = responseText.concat(content);
						// For reasoning models, don't update HTML until filtering is complete
						if (!isReasoning) {
							htmlEl.innerHTML = responseText;
						}
					}
				}
				
				// Filter reasoning content if needed
				if (isReasoning) {
					responseText = this.filterReasoningContent(responseText);
					htmlEl.innerHTML = responseText;
				}
				
				console.log("✅ Groq streaming response completed, length:", responseText.length);
				new Notice("✅ Groq response completed!");
				return responseText;
			} else {
				console.log("Starting non-streaming response...");
				const response = await this.groqClient.chat.completions.create({
					messages: prompt_list as any,
					model: this.modelName,
					max_tokens: this.maxTokens,
					stream: false,
				});

				let responseContent = response.choices[0].message.content;
				
				// Filter reasoning content if needed
				if (isReasoning && responseContent) {
					responseContent = this.filterReasoningContent(responseContent);
				}

				console.log("✅ Groq response received:", responseContent?.substring(0, 100) + "...");
				new Notice("✅ Groq response completed!");
				return responseContent;
			}
		} catch (err) {
			console.error("❌ Groq API call failed:", err);
			this.display_error(err);
			return "Error occurred while calling Groq API";
		}
	};
}
