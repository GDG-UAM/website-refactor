import { Elysia } from "elysia";

export const websocketsPlugin = (app: Elysia) =>
    app.derive(({ server }) => ({
        publish: (room: string, data: unknown) => {
            server?.publish(room, JSON.stringify(data));
        }
    }));

export type WSData = {
    pingInterval?: Timer;
};
