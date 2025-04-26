# CHANGELOG

## 1.7.0

- feat: The output from the AI is parsed through marked-terminal which highlights markdown syntax, this makes reading
  the terminal output much easier.
- fix: Google AI provider error resolved

## 1.6.0

- Option --verbose or for short -v added which logs to the console the full payload sent to the AI service. This is
  helpful to see the full chat thread complete with system prompt.

## 1.5.0

- The system prompt editor now also uses the text editor making multi line input easy

## 1.4.1/2/3

- docs: comments and readme tweaks
- fix: dynamic version number from package json file

## 1.4.0

- Multiline input is now possible, if you do not enter a single line prompt and instead just press enter, your systems
  default editor opens. The contents of which upon saving are passed as the prompt. This allows for much bigger prompts
  to be sent.
- Custom model selection; by default you can pick from the popular models from google, anthropic and openai, but you can
  now also test other models by selecting "other" and typing the model name in manually.

## 1.3.0

- Added the option to set a system prompt
- A default system prompt has also been added
    - "You should be concise and as accurate as possible in your output. As few a niceties as possible. This is a
      developer you are talking to, they want rapid fast answers and on point. If needed, ask the user to make their
      question more accurate and less obtuse to enable you to provide a very on point answer."

## 1.2.1

Docs, specifically table of contents added to the [README.md](./README.md)

## 1.2.0

- Persist keys when jumping between models, this speeds up the ability to test different models
- When `set` is called but not previously user (ie no api key found) it will ask
- `config-clear` added to clear all persisted config data

## 1.1.1 && 1.1.2

Docs

## 1.1.0

- Run `--help` to see all options
- Google gemini added, run `ls` to see models and `set` to use
- Split out the streaming functions into own files, the single cli.js was getting too long

## 1.0.1

- Docs added and this changelog

## 1.0.0

- Initial version
