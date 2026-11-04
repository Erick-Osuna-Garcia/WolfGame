import { Body, Controller, Get, HttpException, Inject, Post, Query, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { RoomsService, RoomError } from "./rooms.service";

const COOKIE = "wo_session";

@Controller()
export class HealthController {
  constructor(@Inject(RoomsService) private readonly rooms: RoomsService) {}

  @Get("/api/health")
  health() {
    return { ok: true };
  }

  @Post("/api/rooms")
  async create(@Body() body: { configId?: string }, @Res({ passthrough: true }) res: Response) {
    const created = await wrap(() => this.rooms.createRoom(body?.configId));
    setCookie(res, created.session.token);
    return created;
  }

  @Post("/api/rooms/join")
  async join(@Body() body: { code: string; name: string }, @Res({ passthrough: true }) res: Response) {
    const joined = await wrap(() => this.rooms.joinRoom(body.code, body.name));
    setCookie(res, joined.session.token);
    return joined;
  }

  @Post("/api/rejoin")
  async rejoin(
    @Body() body: { token?: string; recoveryCode?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = body.token || readCookie(req);
    const result = await wrap(() => this.rooms.rejoin(token, body.recoveryCode));
    if (result.session.token) setCookie(res, result.session.token);
    return result;
  }

  @Get("/api/me")
  async me(@Req() req: Request) {
    const token = readCookie(req);
    if (!token) throw new HttpException({ code: "NO_SESSION", message: "Sin sesión" }, 401);
    return { view: await wrap(() => this.rooms.viewByToken(token)), token };
  }

  @Get("/api/configs")
  configs() {
    return this.rooms.listConfigs();
  }

  @Post("/api/configs")
  async saveConfig(@Body() body: { name: string }, @Req() req: Request) {
    const token = readCookie(req);
    if (!token) throw new HttpException({ code: "NO_SESSION", message: "Sin sesión" }, 401);
    return wrap(() => this.rooms.saveConfig(token, body.name));
  }

  @Get("/api/history")
  async history(@Req() req: Request, @Query("token") queryToken?: string) {
    const token = queryToken || readCookie(req);
    if (!token) throw new HttpException({ code: "NO_SESSION", message: "Sin sesión" }, 401);
    return { events: await wrap(() => this.rooms.history(token)) };
  }
}

function setCookie(res: Response, token: string) {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24,
  });
}

function readCookie(req: Request): string | undefined {
  const cookies = req.headers.cookie ?? "";
  const match = cookies
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`));
  return match?.slice(COOKIE.length + 1);
}

async function wrap<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof RoomError) {
      const status = error.code === "NOT_FOUND" || error.code === "NO_SESSION" ? 404 : 400;
      throw new HttpException({ code: error.code, message: error.message }, status);
    }
    throw error;
  }
}
