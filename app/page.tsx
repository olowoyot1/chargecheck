"use client";

import dynamic from "next/dynamic";

const HomeClient = dynamic(() => import("@/components/home-client"), {
  ssr: false,
  loading: () => <main aria-busy="true" />,
});

export default function Page() {
  return <HomeClient />;
}
