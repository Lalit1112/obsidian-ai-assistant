# Obsidian AI Assistant

Simple plugin to enable interactions with AI models such as [OpenAI ChatGPT](https://openai.com/blog/chatgpt), [Anthropic Claude](https://docs.anthropic.com/en/docs/models-overview), [Google Gemini](https://ai.google.dev/gemini-api), [OpenAI DALL·E](https://openai.com/product/dall-e-3), [OpenAI Whisper](https://openai.com/research/whisper) directly from your [Obsidian](https://obsidian.md/) notes.

The current available features of this plugin are:

-   🤖 Text assistant with OpenAI GPTs, Anthropic Claude, Google Gemini, and Groq Cloud models,
-   🖼 Image generation with DALL·E3 and DALL·E2,
-   🗣 Speech to text with Whisper.

## Latest Updates

- **NEW**: GroqCloud Compound model with web search and code execution tools
- **NEW**: 5 specialized GroqCloud presets - Fact Check, Research, Maths Calculation, Python Testing & Debugging, and Python Code Creation
- **NEW**: Response length selector - Choose between Short (500), Normal (3000), or Long (5000) token responses
- **NEW**: Groq Cloud integration - 4 high-performance models with ultra-fast inference
- **NEW**: Model selection per query - choose different models for individual prompts without changing defaults
- **NEW**: Critique mode - get a second AI model's analysis and feedback on responses (60-second delay)
- **NEW**: Quartz publishing optimization prompt - prepare notes for web publication with SEO and readability suggestions
- Claude 4 models and OpenAI GPT-5 series are now available
- **NEW**: Google Gemini 2.5 Pro and 2.5 Flash models now supported!
- **NEW**: Custom prompts feature - define up to 3 frequently used prompts for quick selection
- **IMPROVED**: Better prompt behavior setting with clearer options (replace vs. append)

## How to use

### 🤖 Text Assistant

You have two commands to interact with the text assistant:

1. Chat mode,
2. Prompt mode.

|        Chat Mode        |        Prompt Mode        |
| :---------------------: | :-----------------------: |
| ![](gifs/chat_mode.gif) | ![](gifs/prompt_mode.gif) |

#### Chat mode

Chat with the AI assistant from your Vault to generate content for your notes.
From the chat, you can clic on any interaction to copy it directly to your clipboard.
You can also copy the whole conversation.
Chat mode now allows you to upload images to interact with GPT4-Vision or Claude models.

#### Prompt mode

Prompt mode allows you to use a selected piece of text from your note as input for the assistant.
From here you can ask the assistant to translate, summarize, generate code etc.

**Model Selection**: Choose different AI models for individual queries without changing your default settings. Select from OpenAI GPT-5 series, Anthropic Claude, Google Gemini, Groq Cloud models, or the advanced GroqCloud Compound model per request.

**Critique Mode**: Enable a second AI model to analyze and provide feedback on the primary response. After receiving the initial response, wait 60 seconds for detailed critique with bullet-point feedback on accuracy, missing elements, clarity, and improvements.

**Built-in Prompts**: Eight specialized prompts are always available:
- **📝 Fix grammar and spelling (with highlights)** - Enhanced grammar correction with ==markdown highlighting== for all changes
- **🏗️ Suggest markdown structure improvements** - Document organization and readability suggestions
- **🌐 Optimize for Quartz web publishing** - Prepare notes for web publication with SEO and readability guidance
- **🔍 Fact Check on Web (GroqCloud)** - Verify content accuracy with internet research and source citations
- **🔬 Research on Web (GroqCloud)** - Conduct thorough technical research with official documentation and community resources
- **🧮 Maths Calculation (GroqCloud)** - Solve mathematical problems with step-by-step calculations and code execution
- **🐍 Python Code Testing & Debugging (GroqCloud)** - Test, debug, and improve Python code with execution capabilities
- **💻 Python Code Creation (GroqCloud)** - Create clean, efficient Python code with proper error handling and documentation

**Custom Prompts**: Define up to 3 frequently used prompts in the settings (e.g., "Translate to Spanish", "Summarize this text"). These will appear as quick-select options in the prompt modal, saving you time on common tasks.

**Response Length Selector**: Control the length of AI responses with three options:
- **Short** (~500 tokens) - Concise answers for quick information
- **Normal** (~3000 tokens) - Balanced responses for most use cases
- **Long** (~5000 tokens) - Detailed, comprehensive answers for complex topics

### 🖼 Image Assistant

Generate images for your notes.\
In the result window, select the images you want to keep.\
They will automatically be downloaded to your vault and their path copied to your clipboard.\
Then, you can paste the images anywhere in your notes.

<img src="gifs/image_generator.gif" alt= “” width="55%">

### 🗣 Speech to Text

Launch the Speech to Text command and start dictating your notes.\
The transcript will be immediately added to your note at your cursor location.

## Settings

### Text Assistant

-   **Model choice**: choice of the default text model. Latest models available:
    - **OpenAI**: GPT-5, GPT-5 Mini, GPT-5 Nano, GPT-4o, GPT-4.1
    - **Anthropic**: Claude Opus 4.1, Claude Sonnet 4
    - **Google**: Gemini 2.5 Pro, Gemini 2.5 Flash
    - **Groq Cloud**: Llama 3.3 70B Versatile, Qwen 3 32B, GPT-OSS 120B, DeepSeek R1 Distill Llama 70B, GroqCloud Compound (with web search and code execution tools)
-   **Critique Model**: choose the default model for critique mode (should be stronger than your primary model for best analysis)
-   **Maximum number of tokens** in the generated answer
-   **Prompt behavior**: When ON - replaces selected text with AI response. When OFF - keeps selected text and adds AI response below it.
-   **Custom Prompts**: Define up to 3 frequently used prompts that will appear as quick-select options in prompt mode.

### Image Assistant

-   You can switch between **DALL·E3** and **DALL·E2**,
-   Change the default folder of generated images.

### Speech to Text

-   The model used is **Whisper**,
-   You can change the default **language** to improve the accuracy and latency of the model. If you leave it empty, the model will automatically detect it.

### Custom Prompts

-   **Custom Prompt 1-3**: Define your most frequently used prompts (e.g., "Translate to Spanish", "Summarize this text", "Fix grammar and spelling")
-   These prompts will appear as dropdown options in prompt mode for quick selection
-   You can still type custom prompts directly if needed

## How to install

#### From the community plugins

<!-- Community plugin submission coming soon - install from GitHub for now -->

#### Get latest version from git

1. `cd path/to/vault/.obsidian/plugins`
2. `git clone https://github.com/Lalit1112/obsidian-ai-assistant.git && cd obsidian-ai-assistant`
3. `npm install && npm run build`
4. Open **Obsidian Preferences** -> **Community plugins**
5. Refresh Installed plugins and activate AI Assistant.

## Requirements

-   To use this plugin with **OpenAI models**, you need an official API key from [here](https://platform.openai.com/account/api-keys)
-   To use this plugin with **Anthropic Claude models**, you need an official API key from [here](https://console.anthropic.com/settings/keys)
-   To use this plugin with **Google Gemini models**, you need an official API key from [here](https://ai.google.dev/gemini-api/docs/api-key)
-   To use this plugin with **Groq Cloud models**, you need an official API key from [here](https://console.groq.com/keys)

