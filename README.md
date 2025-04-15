# AI-Shell (ais)

![Screenshot](docs/screenshot.png)

[![npm version](https://badge.fury.io/js/ai-shell.svg)](https://badge.fury.io/js/ai-shell)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
<!-- [![Downloads](https://img.shields.io/npm/dm/ai-shell.svg)](https://www.npmjs.com/package/ai-shell) -->
<!-- Optional: Add downloads badge after publishing -->

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Installation](#installation)
- [Usage](#usage)
  - [1. Configuration (First Time or Updating)](#1-configuration-first-time-or-updating)
    - [Setting a system prompt](#setting-a-system-prompt)
  - [2. Asking Questions](#2-asking-questions)
    - [Long prompt input](#long-prompt-input)
  - [3. End a chat](#3-end-a-chat)
  - [4. Listing Services & Current Configuration](#4-listing-services--current-configuration)
  - [5. Getting Help & Listing All Commands](#5-getting-help--listing-all-commands)
- [Configuration Storage](#configuration-storage)
- [Contributing](#contributing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


A command-line interface (CLI) tool to interact seamlessly with various AI services like Google (Gemini), OpenAI (GPT)
and Anthropic (Claude) directly from your terminal.

For those who feel cursor or co-pilot etc is not for them but loading a whole web-gui is too slow... fire up a terminal
in your ide, or wherever, and get right to it.

The AI then becomes more like your teacher opposed to cursor or co-pilot being the coder...

Engage in interactive chat sessions or get quick answers to single prompts without leaving your command line. `ai-shell`
securely stores your preferences and API keys locally.

The tool will automatically open your default cli text editor for longer prompts, just call the tool `ais` and press
enter without a single line prompt.

## Installation

Requires Node.js (v18 or later recommended).

Install the package globally using npm:

```bash
npm install -g ai-shell
```

## Usage

### 1. Configuration (First Time or Updating)

(you can just ask a question and as nothing will be set already it will then ask for which model and keys)

Before using `ais`, you need to configure your preferred AI service, model, and API key. Run:

```bash
ais set
```

This interactive command will guide you through:

- Selecting an AI service provider (OpenAI or Anthropic).
- Choosing a specific model available for that service (e.g., gpt-4o-mini, claude-3-5-sonnet).
- Entering your API key for the selected service (input will be masked).

Your configuration is saved locally for future use.

- You can run ais set again anytime to change your settings.
- API keys (service keys) are stored in the local config, when jumping between models this speeds up the process by
  removing the need to copy and paste in the api key more than once.
- When `set` is called and a service picked, but not previously used (ie no api key found), it will ask for an API key
  and add to the dict of keys

#### Setting a system prompt

A default system prompt is set as:

_"You should be concise and as accurate as possible in your output. As few a niceties as possible. This is a
developer you are talking to, they want rapid fast answers and on point. If needed, ask the user to make their
question more accurate and less obtuse to enable you to provide a very on point answer."_

You can override this by calling the set system prompt command:

```bash
ais set-system-prompt

# or for short
ais sp
```

This will replace the current system prompt with your input.

### 2. Asking Questions

Pass your prompt directly as arguments after the ais command:

```bash
ais "Explain the difference between HTTP and HTTPS in simple terms"
```

The AI's response will be streamed directly to your terminal leaving you to continue talking to the model. You can then
continue the conversation by continuing to type.

#### Long prompt input

Longer prompts with line breaks are usually required at some point. To handle this the tool (on linux) will open the
default editor (it will default to nano when `process.env.EDITOR` is not set).

This all functions by 1st creating a temporary file in the OS tmp folder, opens the file thus allowing you to write to
it. After you save the changes and close the file, `ai-shell` grabs the content and uses it as the prompt while at the
same time removing the tmp file form disk.

### 3. End a chat

To end the chat just press "control + c"

### 4. Listing Services & Current Configuration

To see which service and model are currently configured.
This will display the active service provider and model identifier. It will not display your API key.

```bash
ais config
```

To see the available models you can currently talk to:

```bash
ais list
# or the alias:
ais ls
```

### 5. Getting Help & Listing All Commands

For a list of all available commands and options:

```bash
ais --help
```

## Configuration Storage

Configuration (service, model, API key) is stored locally using the conf package. You can typically find the
configuration file at:

- Linux: `~/.config/ais-cli-nodejs/config.json`
- macOS: `~/Library/Preferences/ais-cli-nodejs/config.json`
- Windows: `%APPDATA%\ais-cli-nodejs\Config\config.json`

## Contributing

Contributions, issues, and feature requests are welcome! 

