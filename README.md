# writer

This repo is intended to be an opinionated, AI-maximalist text editor for AI-assisted creative writing.

The problem: most existing "AI-assisted" text editors don't support proper context engineering. They do weird things like auto-cropping the context so that the AI is only seeing some content to save costs etc.

For this, we want to be able to use the most powerful/creative models at full cost, spending whatever's necessary.

The core concept of this should be the primitive of the chat session. Chat sessions can be about the document as a whole, or about specific snippets of the document, for focused editing. Or, they can be continuation-oriented. In any event, we should track changes via a git diff-like interface (maybe we just use literal git?) for reproducibility, same as code.

The user should be able to edit the document via a vanilla text editor with basic formatting etc., or they should be able to open chats. Chats should be mini-windows that can be dragged around, resized, exited, etc., with all former chats viewable from a sidebar or something (we should store the chats on disk.)

This should be a local program that edits files that already reside on the user's computer. doc.md is an example of such a file. We should use the browser via localhost as the interface.

I'm open to any implementation methodology - vanilla HTML + JS, React, Next, etc - but for a more "high-touch" implementation needing e.g. server-side actions etc, we should use Next as my preferred neo-framework. Since we only intend for this to run locally, if we don't need a high-touch framework, we should avoid it.

I'd like to use the Claude Agent SDK for native Claude file editing support etc. See claude_agent_sdk.md for docs, or be sure to ask for any other resources you need.