import { describeRules, listKinds } from "../../src/domain/diagram/agentApi.ts";

export function kindsResource(): { uri: string; text: string } {
  return {
    uri: "arkuml://kinds",
    text: JSON.stringify(listKinds()),
  };
}

export function kindResource(
  kind: string,
): { uri: string; text: string } | undefined {
  const described = describeRules(kind);
  if (!described.ok) {
    return undefined;
  }
  return {
    uri: `arkuml://kind/${kind}`,
    text: JSON.stringify(described.value),
  };
}
