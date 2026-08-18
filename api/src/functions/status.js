import { app } from "@azure/functions";

app.http("status", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "status",

    handler: async (request, context) => {
        try {
            const token = process.env.UPTIMEROBOT_API_TOKEN;

            if (!token) {
                return {
                    status: 500,
                    jsonBody: {
                        error: "UPTIMEROBOT_API_TOKEN is not configured."
                    }
                };
            }

            const response = await fetch(
                "https://api.uptimerobot.com/v3/monitors",
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Accept": "application/json"
                    }
                }
            );

            if (!response.ok) {
                const body = await response.text();

                context.error(
                    `UptimeRobot returned HTTP ${response.status}: ${body}`
                );

                return {
                    status: 502,
                    jsonBody: {
                        error: "Unable to retrieve UptimeRobot monitors.",
                        upstreamStatus: response.status
                    }
                };
            }

            const data = await response.json();

            return {
                status: 200,
                headers: {
                    "Cache-Control": "no-store"
                },
                jsonBody: {
                    updated: new Date().toISOString(),
                    data: data
                }
            };
        }
        catch (error) {
            context.error(error);

            return {
                status: 500,
                jsonBody: {
                    error: "Unexpected error retrieving status."
                }
            };
        }
    }
});
