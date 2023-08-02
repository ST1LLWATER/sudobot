/*
 * This file is part of SudoBot.
 *
 * Copyright (C) 2021-2023 OSN Developers.
 *
 * SudoBot is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * SudoBot is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with SudoBot. If not, see <https://www.gnu.org/licenses/>.
 */

import { formatDistanceToNowStrict } from "date-fns";
import { EmbedBuilder } from "discord.js";
import Queue from "../utils/Queue";
import { log, logError } from "../utils/logger";

export default class ReminderQueue extends Queue {
    async run(userId: string, message: string) {
        try {
            log("Reminding user");

            const user = this.client.users.cache.get(userId) ?? (await this.client.users.fetch(userId));

            if (!user) {
                throw new Error("User is null | undefined");
            }

            await user.send({
                embeds: [
                    new EmbedBuilder({
                        color: 0x007bff,
                        author: {
                            name: "Reminder Notification",
                            icon_url: this.client.user?.displayAvatarURL()
                        },
                        description: message?.trim() === "" ? "*No message specified*" : message,
                        footer: {
                            text: `You had set this reminder ${formatDistanceToNowStrict(this.createdAt, { addSuffix: true })}`
                        }
                    }).setTimestamp()
                ]
            });
        } catch (e) {
            logError(e);
        }
    }
}