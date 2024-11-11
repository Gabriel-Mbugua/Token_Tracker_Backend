import { getClient } from "./connection.js";
import format from "pg-format";

export const addDocument = async ({ table, id, data }) => {
    try {
        if (!table || !id || !data) throw new Error("Invalid data");

        const client = await getClient();
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = Array.from({ length: values.length + 1 }, (_, i) => `$${i + 1}`);

        const query = format(
            "INSERT INTO %I (id, %s) VALUES (%s) RETURNING *",
            table,
            columns.join(", "),
            placeholders.join(", ")
        );

        const response = await client.query(query, [id, ...values]);

        return response.rows[0];
    } catch (err) {
        console.error(err);
        if (err instanceof Error) throw err;
        throw new Error("ADD_DOCUMENT_ERROR");
    }
};

export const getDocument = async ({ id, table, select = "*" }) => {
    try {
        if (!id || !table) throw new Error("Invalid data");

        const client = await getClient();

        const query = format("SELECT %s FROM %I WHERE id = $1", select, table);

        const response = await client.query(query, [id]);

        return response.rows[0];
    } catch (err) {
        console.error(err);
        if (err instanceof Error) throw err;
        throw new Error("GET_DOCUMENT_ERROR");
    }
};

export const updateDocument = async ({ table, id, data }) => {
    try {
        if (!table || !id || !data) throw new Error("Invalid data");

        const setClause = Object.keys(data)
            .map((key, index) => format("%I = $%s", key, index + 2))
            .join(", ");

        const query = format("UPDATE %I SET %s WHERE id = $1 RETURNING *", table, setClause);

        const response = await client.query(query, [id, ...Object.values(data)]);

        if (response.rowCount === 0) {
            throw new Error("Document not found");
        }

        return response.rows[0];
    } catch (err) {
        console.error(err);
        if (err instanceof Error) throw err;
        throw new Error("UPDATE_DOCUMENT_ERROR");
    }
};

export const deleteDocument = async ({ table, id }) => {
    try {
        if (!table || !id) throw new Error("Invalid data.");

        const client = await getClient();

        const query = format("DELETE FROM %I WHERE id = $1 RETURNING *", table);

        const response = await client.query(query, [id]);

        if (response.rowCount === 0) {
            throw new Error(`Document not found with id: ${id}`);
        }

        return response.rows[0];
    } catch (err) {
        console.error(err);
        if (err instanceof Error) throw err;
        throw new Error("DELETE_DOCUMENT_ERROR");
    }
};
