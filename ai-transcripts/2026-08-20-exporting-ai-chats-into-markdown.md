## Me
Can I export my AI Chats to Markdown in the format when I started the chats (e.g.: 2026-01-01 + title) from my IntellJ to my local disk?

## AI Assistant
IntelliJ IDEA’s **AI Assistant currently does not provide a built-in “Export all chats to Markdown” feature**. Its chat history is stored per project and can be viewed, renamed, searched, or deleted from the **Chat History** list, but JetBrains’ documentation does not describe a Markdown or bulk-export option [[1]](https://www.jetbrains.com/help/ai-assistant/ai-chat.html#chat-history).

### Available options

1. **Copy chats manually**
    - Open **AI Chat**.
    - Select a conversation from **Chat History**.
    - Copy the conversation into a local `.md` file.
    - Rename the file, for example:
```plain text
2026-01-01 - Explain authentication flow.md
```


2. **Ask AI Assistant to format the current chat**
   You can ask:
   > Convert this conversation into Markdown. Start with a YAML front matter block containing the chat start date and title.

   Then copy the result into a file.

3. **Use a script or plugin**
   A third-party plugin or UI-automation script could potentially extract the displayed chat history, but this is not an official IntelliJ-supported export mechanism and may break when the AI Assistant UI changes.

The chat title is generated from the initial query, and IntelliJ allows you to rename it from the Chat History list. However, the documented UI does not expose the original chat-start timestamp, so you may need to record or infer the date manually.
