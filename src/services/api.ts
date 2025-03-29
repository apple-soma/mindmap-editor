const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const API_URL = import.meta.env.VITE_OPENAI_API_URL;

/**
 * ChatGPT API を呼び出してロジックツリーのサンプル問題を生成
 * @returns {Promise<string>} 生成されたロジックツリーの問題
 */
export const fetchLogicTreeSample = async (): Promise<string> => {
  console.log(import.meta.env)
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "ロジックツリーのサンプル問題を1つ作成してください。" }], // ✅ `prompt` ではなく `messages`
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error fetching logic tree sample:", error);
    return "エラーが発生しました。もう一度お試しください。";
  }
};
