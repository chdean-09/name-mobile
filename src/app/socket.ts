"use client";

import { io } from "socket.io-client";

export const socket = io("https://name-server-production.up.railway.app/");