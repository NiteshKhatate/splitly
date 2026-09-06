import type { Instrumentation } from "next";

import { captureServerError } from "@/lib/monitoring/server-monitor";
import { installServerConsoleRedaction } from "@/lib/monitoring/redaction";

export function register() {
  installServerConsoleRedaction();
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  await captureServerError("next_request_error", {
    errorName: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "Unknown request error",
    method: request.method,
    path: request.path,
    routeType: context.routeType,
  });
};
