import type { Metadata } from "next";
import { GarageShowroom } from "@/components/garage/GarageShowroom";

export const metadata: Metadata = {
  title: "Showroom",
  description:
    "Inspect mock ad formats on a measurement frame. No live ads — demo clicks stay in the garage.",
};

export default function GaragePage() {
  return <GarageShowroom />;
}
