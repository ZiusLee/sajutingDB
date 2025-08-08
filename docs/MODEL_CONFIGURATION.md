# 🚨 CRITICAL: AI Model Configuration - DO NOT CHANGE

## Main Chat Model Configuration

**NEVER CHANGE THESE SETTINGS WITHOUT EXPLICIT PERMISSION**

### Primary Chat Model (saju-chat API)
- **Model**: `gpt-5` 
- **verbosity**: `low`
- **reasoning effort**: `minimal`
- **Max Tokens**: `2048`

### Configuration Location
- File: `app/api/saju-chat/route.ts`
- Function: `streamText()` call in the main POST handler

### Code Block (DO NOT MODIFY):
\`\`\`typescript
const result = await streamText({
  messages: apiMessages,
  model: openai("gpt-5"),
  verbosity: low,
  maxTokens: 2048,
  reasoning_effort: minimal,
})
\`\`\`

## Emergency Contact

If model changes are absolutely necessary:
1. Document the reason
2. Test thoroughly 
3. Get explicit approval
4. Update this documentation

---

**⚠️ WARNING: Unauthorized model changes will break the saju interpretation quality and user experience.**
