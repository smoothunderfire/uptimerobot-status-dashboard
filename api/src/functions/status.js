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
                        error: "API configuration error."
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

                context.error(
                    `UptimeRobot returned ${response.status}`
                );

                return {
                    status: 502,
                    jsonBody: {
                        error: "Unable to retrieve system status."
                    }
                };
            }

            const result = await response.json();

            const monitors = result.data
                .map(monitor => ({
                    name: monitor.friendlyName,
                    status: monitor.status
                }))
                .sort((a, b) =>
                    a.name.localeCompare(b.name)
                );

            const allUp = monitors.every(
                monitor => monitor.status === "UP"
            );

            return {
                status: 200,

                headers: {
                    "Cache-Control":
                        "public, max-age=30"
                },

                jsonBody: {
                    updated:
                        new Date().toISOString(),

                    overallStatus:
                        allUp ? "UP" : "ISSUE",

                    monitors: monitors
                }
            };

        }
        catch (error) {

            context.error(error);

            return {
                status: 500,

                jsonBody: {
                    error:
                        "Unable to retrieve system status."
                }
            };
        }
    }
});
