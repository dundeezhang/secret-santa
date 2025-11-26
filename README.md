Secret santa matching tool.

1. Add in your info into the .env
2. Make the file names.txt

3. Enter names and email in names.txt like:

```
name0 email0
name1 email1
name2 email2
```

4. Then run: npm start

5. enjoy.

Note that there must be 3 or more people in the exchange.

## Customizing the Email

To customize the email content that participants receive, edit the `email.html` file.

The template uses placeholders:

- `{{SANTA_NAME}}` - Will be replaced with the recipient's name
- `{{RECEIVER_NAME}}` - Will be replaced with who they're buying for

Both `emailService.js` and `previewEmail.js` pull from this centralized template.

**Note:** The plain text version of the email is automatically extracted from the HTML body section, so you only need to edit the HTML.

Use `npm run preview` to preview your changes before sending.
