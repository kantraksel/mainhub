import { Context, createContext } from "react";

export interface Service {
    name: string;
    link: string;
}

export interface Profile {
    name: string;
    discordId: string;
    services: Service[];
}

export const ProfileContext = createContext(null) as Context<Profile | null>;
