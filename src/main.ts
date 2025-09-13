import {
	App,
	Editor,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { ChatModal, ImageModal, PromptModal, SpeechModal } from "./modal";
import { AnthropicAssistant, GeminiAssistant, GroqAssistant, OpenAIAssistant } from "./openai_api";
import {
	ALL_IMAGE_MODELS,
	ALL_MODELS,
	DEFAULT_IMAGE_MODEL,
	DEFAULT_OAI_IMAGE_MODEL,
	DEFAULT_MAX_TOKENS,
} from "./settings";

interface AiAssistantSettings {
	mySetting: string;
	openAIapiKey: string;
	anthropicApiKey: string;
	geminiApiKey: string;
	groqApiKey: string;
	modelName: string;
	critiqueModelName: string;
	imageModelName: string;
	maxTokens: number;
	replaceSelection: boolean;
	imgFolder: string;
	language: string;
	customPrompt1: string;
	customPrompt2: string;
	customPrompt3: string;
}

const DEFAULT_SETTINGS: AiAssistantSettings = {
	mySetting: "default",
	openAIapiKey: "",
	anthropicApiKey: "",
	geminiApiKey: "",
	groqApiKey: "",
	modelName: "gpt-4o",
	critiqueModelName: "claude-opus-4-1-20250805",
	imageModelName: DEFAULT_IMAGE_MODEL,
	maxTokens: DEFAULT_MAX_TOKENS,
	replaceSelection: true,
	imgFolder: "AiAssistant/Assets",
	language: "",
	customPrompt1: "",
	customPrompt2: "",
	customPrompt3: "",
};

export default class AiAssistantPlugin extends Plugin {
	settings: AiAssistantSettings;
	aiAssistant: OpenAIAssistant;

	build_api() {
		if (this.settings.modelName.includes("claude")) {
			this.aiAssistant = new AnthropicAssistant(
				this.settings.openAIapiKey,
				this.settings.anthropicApiKey,
				this.settings.modelName,
				this.settings.maxTokens,
			);
		} else if (this.settings.modelName.includes("gemini")) {
			this.aiAssistant = new GeminiAssistant(
				this.settings.openAIapiKey,
				this.settings.geminiApiKey,
				this.settings.modelName,
				this.settings.maxTokens,
			);
		} else {
			this.aiAssistant = new OpenAIAssistant(
				this.settings.openAIapiKey,
				this.settings.modelName,
				this.settings.maxTokens,
			);
		}
	}

	async onload() {
		await this.loadSettings();
		this.build_api();

		this.addCommand({
			id: "chat-mode",
			name: "Open Assistant Chat",
			callback: () => {
				new ChatModal(this.app, this.aiAssistant).open();
			},
		});

		this.addCommand({
			id: "prompt-mode",
			name: "Open Assistant Prompt",
			editorCallback: async (editor: Editor) => {
				const selected_text = editor.getSelection().toString().trim();
				new PromptModal(
					this.app,
					async (x: { [key: string]: string }) => {
						const selectedModel = x["selectedModel"] || this.settings.modelName;
						const critiqueEnabled = x["critiqueEnabled"] === "true";
						const selectedCritiqueModel = x["selectedCritiqueModel"] || this.settings.critiqueModelName;

						// Get the appropriate assistant based on selected model
						const primaryAssistant = this.getAssistantForModel(selectedModel);

						// Primary model call
						let answer = await primaryAssistant.text_api_call([
							{
								role: "user",
								content: x["prompt_text"] + " : " + selected_text,
							},
						]);
						answer = answer!;
						
						if (critiqueEnabled && answer) {
							// Show primary response first
							this.insertResponse(editor, selected_text, answer);
							
							// Show notice about critique preparation
							new Notice("Preparing critique... This will take about 60 seconds.");
							
							// Wait 60 seconds, then call critique model
							setTimeout(async () => {
								try {
									const critiqueAssistant = this.getAssistantForModel(selectedCritiqueModel);
									const critiquePrompt = `Critique this response. Be precise and direct - no filler words or lengthy explanations. Use bullet points.

Request: "${x["prompt_text"]}"
Original: "${selected_text}"
Response: "${answer}"

Provide:
• Accuracy issues (if any)
• Missing elements
• Clarity problems  
• Specific improvements

Critique:`;

									const critique = await critiqueAssistant.text_api_call([
										{
											role: "user",
											content: critiquePrompt,
										},
									]);

									if (critique) {
										// Insert critique below the primary response
										const cursor = editor.getCursor("to");
										const critiqueText = `\n\n---\n**🤔 Critique:**\n${critique.trim()}`;
										editor.setCursor(cursor.line, cursor.ch);
										editor.replaceRange(critiqueText, cursor);
										new Notice("Critique completed!");
									}
								} catch (error) {
									new Notice("Error generating critique: " + error.message);
								}
							}, 60000); // 60 second delay
						} else {
							// No critique - just insert the primary response
							this.insertResponse(editor, selected_text, answer);
						}
					},
					false,
					{
						customPrompt1: this.settings.customPrompt1,
						customPrompt2: this.settings.customPrompt2,
						customPrompt3: this.settings.customPrompt3,
						modelName: this.settings.modelName,
						critiqueModelName: this.settings.critiqueModelName,
					},
				).open();
			},
		});

		this.addCommand({
			id: "img-generator",
			name: "Open Image Generator",
			editorCallback: async (editor: Editor) => {
				new PromptModal(
					this.app,
					async (prompt: { [key: string]: string }) => {
						const answer = await this.aiAssistant.img_api_call(
							this.settings.imageModelName,
							prompt["prompt_text"],
							prompt["img_size"],
							parseInt(prompt["num_img"]),
							prompt["is_hd"] === "true",
						);
						if (answer) {
							const imageModal = new ImageModal(
								this.app,
								answer,
								prompt["prompt_text"],
								this.settings.imgFolder,
							);
							imageModal.open();
						}
					},
					true,
					{ model: this.settings.imageModelName },
				).open();
			},
		});

		this.addCommand({
			id: "speech-to-text",
			name: "Open Speech to Text",
			editorCallback: (editor: Editor) => {
				new SpeechModal(
					this.app,
					this.aiAssistant,
					this.settings.language,
					editor,
				).open();
			},
		});

		this.addSettingTab(new AiAssistantSettingTab(this.app, this));
	}

	onunload() {}

	getAssistantForModel(modelName: string): OpenAIAssistant | AnthropicAssistant | GeminiAssistant | GroqAssistant {
		// Determine which assistant to use based on model name
		if (modelName.startsWith("claude")) {
			return new AnthropicAssistant(this.settings.openAIapiKey, this.settings.anthropicApiKey, modelName, this.settings.maxTokens);
		} else if (modelName.startsWith("gemini")) {
			return new GeminiAssistant(this.settings.openAIapiKey, this.settings.geminiApiKey, modelName, this.settings.maxTokens);
		} else if (modelName.includes("llama") || modelName.includes("qwen") || modelName.includes("deepseek") || modelName.includes("gpt-oss")) {
			return new GroqAssistant(this.settings.openAIapiKey, this.settings.groqApiKey, modelName, this.settings.maxTokens);
		} else {
			// Default to OpenAI for all other models
			return new OpenAIAssistant(this.settings.openAIapiKey, modelName, this.settings.maxTokens);
		}
	}

	insertResponse(editor: Editor, selectedText: string, response: string) {
		if (this.settings.replaceSelection) {
			// Replace the selected text with AI answer
			if (response) {
				editor.replaceSelection(response.trim());
			}
		} else {
			// Keep original text and insert AI answer below
			if (response) {
				const cursor = editor.getCursor("to");
				editor.setCursor(cursor.line, cursor.ch);
				editor.replaceRange("\n" + response.trim(), cursor);
			}
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class AiAssistantSettingTab extends PluginSettingTab {
	plugin: AiAssistantPlugin;

	constructor(app: App, plugin: AiAssistantPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("h2", { text: "Settings for my AI assistant." });

		new Setting(containerEl).setName("OpenAI API Key").addText((text) =>
			text
				.setPlaceholder("Enter OpenAI key here")
				.setValue(this.plugin.settings.openAIapiKey)
				.onChange(async (value) => {
					this.plugin.settings.openAIapiKey = value;
					await this.plugin.saveSettings();
					this.plugin.build_api();
				}),
		);

		new Setting(containerEl).setName("Anthropic API Key").addText((text) =>
			text
				.setPlaceholder("Enter Anthropic key here")
				.setValue(this.plugin.settings.anthropicApiKey)
				.onChange(async (value) => {
					this.plugin.settings.anthropicApiKey = value;
					await this.plugin.saveSettings();
					this.plugin.build_api();
				}),
		);

		new Setting(containerEl).setName("Gemini API Key").addText((text) =>
			text
				.setPlaceholder("Enter Gemini key here")
				.setValue(this.plugin.settings.geminiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.geminiApiKey = value;
					await this.plugin.saveSettings();
					this.plugin.build_api();
				}),
		);

		new Setting(containerEl).setName("Groq API Key").addText((text) =>
			text
				.setPlaceholder("Enter Groq key here")
				.setValue(this.plugin.settings.groqApiKey)
				.onChange(async (value) => {
					this.plugin.settings.groqApiKey = value;
					await this.plugin.saveSettings();
					this.plugin.build_api();
				}),
		);
		containerEl.createEl("h3", { text: "Text Assistant" });

		new Setting(containerEl)
			.setName("Model Name")
			.setDesc("Select your default model")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(ALL_MODELS)
					.setValue(this.plugin.settings.modelName)
					.onChange(async (value) => {
						this.plugin.settings.modelName = value;
						await this.plugin.saveSettings();
						this.plugin.build_api();
					}),
			);

		new Setting(containerEl)
			.setName("Critique Model")
			.setDesc("Select default model for critique mode (should be stronger than primary model)")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(ALL_MODELS)
					.setValue(this.plugin.settings.critiqueModelName)
					.onChange(async (value) => {
						this.plugin.settings.critiqueModelName = value;
						await this.plugin.saveSettings();
						this.plugin.build_api();
					}),
			);

		new Setting(containerEl)
			.setName("Max Tokens")
			.setDesc("Select max number of generated tokens")
			.addText((text) =>
				text
					.setPlaceholder("Max tokens")
					.setValue(this.plugin.settings.maxTokens.toString())
					.onChange(async (value) => {
						const int_value = parseInt(value);
						if (!int_value || int_value <= 0) {
							new Notice("Error while parsing maxTokens ");
						} else {
							this.plugin.settings.maxTokens = int_value;
							await this.plugin.saveSettings();
							this.plugin.build_api();
						}
					}),
			);

		new Setting(containerEl)
			.setName("Prompt behavior")
			.setDesc("When ON: Replace selected text with AI response. When OFF: Keep selected text and add AI response below it.")
			.addToggle((toogle) => {
				toogle
					.setValue(this.plugin.settings.replaceSelection)
					.onChange(async (value) => {
						this.plugin.settings.replaceSelection = value;
						await this.plugin.saveSettings();
						this.plugin.build_api();
					});
			});
		containerEl.createEl("h3", { text: "Image Assistant" });
		new Setting(containerEl)
			.setName("Default location for generated images")
			.setDesc("Where generated images are stored.")
			.addText((text) =>
				text
					.setPlaceholder("Enter the path to you image folder")
					.setValue(this.plugin.settings.imgFolder)
					.onChange(async (value) => {
						const path = value.replace(/\/+$/, "");
						if (path) {
							this.plugin.settings.imgFolder = path;
							await this.plugin.saveSettings();
						} else {
							new Notice("Image folder cannot be empty");
						}
					}),
			);
		new Setting(containerEl)
			.setName("Image Model Name")
			.setDesc("Select your model")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(ALL_IMAGE_MODELS)
					.setValue(this.plugin.settings.imageModelName)
					.onChange(async (value) => {
						this.plugin.settings.imageModelName = value;
						await this.plugin.saveSettings();
						this.plugin.build_api();
					}),
			);

		containerEl.createEl("h3", { text: "Speech to Text" });
		new Setting(containerEl)
			.setName("The language of the input audio")
			.setDesc("Using ISO-639-1 format (en, fr, de, ...)")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value;
						await this.plugin.saveSettings();
					}),
			);

		containerEl.createEl("h3", { text: "Custom Prompts" });
		containerEl.createEl("p", {
			text: "Define up to 3 custom prompts that will appear as quick-select options in prompt mode:",
			cls: "setting-item-description"
		});

		new Setting(containerEl)
			.setName("Custom Prompt 1")
			.setDesc("First custom prompt")
			.addText((text) =>
				text
					.setPlaceholder("e.g., Translate to Spanish")
					.setValue(this.plugin.settings.customPrompt1)
					.onChange(async (value) => {
						this.plugin.settings.customPrompt1 = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Custom Prompt 2")
			.setDesc("Second custom prompt")
			.addText((text) =>
				text
					.setPlaceholder("e.g., Summarize this text")
					.setValue(this.plugin.settings.customPrompt2)
					.onChange(async (value) => {
						this.plugin.settings.customPrompt2 = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Custom Prompt 3")
			.setDesc("Third custom prompt")
			.addText((text) =>
				text
					.setPlaceholder("e.g., Fix grammar and spelling")
					.setValue(this.plugin.settings.customPrompt3)
					.onChange(async (value) => {
						this.plugin.settings.customPrompt3 = value;
						await this.plugin.saveSettings();
					})
			);

	}
}
