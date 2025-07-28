# 🚨 CRITICAL: AI Model Configuration - DO NOT CHANGE

## Main Chat Model Configuration

**NEVER CHANGE THESE SETTINGS WITHOUT EXPLICIT PERMISSION**

### Primary Chat Model (saju-chat API)
- **Model**: `gpt-4.1` 
- **Temperature**: `1.0`
- **Top P**: `1.0`
- **Max Tokens**: `2048`

### Configuration Location
- File: `app/api/saju-chat/route.ts`
- Function: `streamText()` call in the main POST handler

### Code Block (DO NOT MODIFY):
\`\`\`typescript
const result = await streamText({
  messages: apiMessages,
  model: openai("gpt-4.1"),
  temperature: 1.0,
  maxTokens: 2048,
  top_p: 1.0,
})
\`\`\`

## Why These Settings Matter

1. **gpt-4.1**: Specifically chosen for Korean saju interpretation quality
2. **Temperature 1.0**: Provides creative and varied responses for personalized advice
3. **Top P 1.0**: Ensures full vocabulary range for nuanced Korean expressions
4. **Max Tokens 2048**: Balanced response length for detailed saju analysis

## Other Model Usage

- **Continue Generation**: Uses same model with temperature 0.8
- **Message Parsing**: May use different models as needed
- **Memory Processing**: Uses separate model configurations

## Emergency Contact

If model changes are absolutely necessary:
1. Document the reason
2. Test thoroughly 
3. Get explicit approval
4. Update this documentation

---

**⚠️ WARNING: Unauthorized model changes will break the saju interpretation quality and user experience.**
