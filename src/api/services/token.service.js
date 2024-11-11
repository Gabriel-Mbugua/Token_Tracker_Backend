import format from "pg-format";
import { client } from "../../database/connection.js";

export const getTokens = async ({ limit = 20, riskLevel }) => {
    try {
        const query = format(
            "SELECT * FROM tokens %s ORDER BY created_at DESC LIMIT $1",
            riskLevel ? "WHERE risk_analysis->>'riskLevel' = $2" : ""
        );

        const params = [limit];
        if (riskLevel) params.push(riskLevel);

        const response = await client.query(query, params);

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
