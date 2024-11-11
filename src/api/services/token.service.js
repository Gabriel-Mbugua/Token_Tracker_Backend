import { getClient } from "../../database/connection.js";

export const getTokens = async ({ limit = 20 }) => {
    try {
        const client = await getClient();

        const query = "SELECT * FROM tokens ORDER BY created_at DESC LIMIT $1";

        const response = await client.query(query, [limit]);

        return {
            success: true,
            data: response.rows,
        };
    } catch (err) {
        console.error(err);
        throw new Error(err);
    }
};
// getTokens({}).then((res) => console.log(res));
