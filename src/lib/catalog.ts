import publishersJson from "../../data/publishers.json";
import personasJson from "../../data/shopper_personas.json";
import { PERSONA_PROFILES, PUBLISHER_PROFILES, type PersonaProfile, type PublisherProfile } from "./taxonomy";

export type Publisher = (typeof publishersJson)[number] & { profile: PublisherProfile };
export type Persona = (typeof personasJson)[number] & { profile: PersonaProfile };

function mustGet<T>(map: Record<string, T>, id: string): T {
  const value = map[id];
  if (!value) throw new Error(`No taxonomy profile for ${id}`);
  return value;
}

export const PUBLISHERS: Publisher[] = publishersJson.map((p) => ({ ...p, profile: mustGet(PUBLISHER_PROFILES, p.id) }));
export const PERSONAS: Persona[] = personasJson.map((p) => ({ ...p, profile: mustGet(PERSONA_PROFILES, p.id) }));

export const publisherById = (id: string) => PUBLISHERS.find((p) => p.id === id);
export const personaById = (id: string) => PERSONAS.find((p) => p.id === id);
