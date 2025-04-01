# CHANGELOG

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
