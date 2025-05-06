curl -X 'POST' \
  'https://api.llmapi.com/chat/completions' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant specialized in extracting important keywords from text. For any given text, identify and list the most relevant keywords and key phrases that capture the main topics and concepts."
      },
      {
        "role": "user",
        "content": "Please extract the key keywords from the following text: \n\nClimate change poses an existential threat to our planet. Rising global temperatures have led to more frequent extreme weather events, melting ice caps, and rising sea levels. Governments worldwide are working to reduce carbon emissions through renewable energy initiatives, carbon taxes, and international agreements like the Paris Climate Accord. However, many scientists argue that current efforts are insufficient and more dramatic action is needed to prevent catastrophic consequences."
      }
    ]
}'