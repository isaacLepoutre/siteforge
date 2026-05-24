const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export default async () => {
  return new Response(
    JSON.stringify({
      ok: true,
      apiKeyConfigured: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    }),
    { status: 200, headers },
  );
};
