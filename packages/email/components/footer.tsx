import { Hr, Link, Section, Text } from "@react-email/components";

export function Footer() {
  return (
    <Section className="w-full">
      <Hr />

      <Text className="font-regular text-[14px]">
        Open source Slack alternative -{" "}
        <Link href="https://tryflack.com">Flack</Link>.
      </Text>

      <Text className="text-xs text-[#B8B8B8]">
        Flack | 2261 Market Street, San Francisco, CA 94114
      </Text>
    </Section>
  );
}
