import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/room/$code")({
  component: RoomLayout,
});

function RoomLayout() {
  return <Outlet />;
}
