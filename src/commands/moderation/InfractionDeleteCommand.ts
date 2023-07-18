/**
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

import { PermissionsBitField } from "discord.js";
import Command, { AnyCommandContext, ArgumentType, CommandMessage, CommandReturn, ValidationRule } from "../../core/Command";

export default class InfractionDeleteCommand extends Command {
    public readonly name = "infraction__delete";
    public readonly validationRules: ValidationRule[] = [
        {
            types: [ArgumentType.Integer],
            name: "id",
            requiredErrorMessage: `Please provide an infraction ID!`,
            typeErrorMessage: `Please provide a __valid__ infraction ID!`
        }
    ];
    public readonly permissions = [PermissionsBitField.Flags.ModerateMembers, PermissionsBitField.Flags.ViewAuditLog];
    public readonly permissionMode = "or";

    async execute(message: CommandMessage, context: AnyCommandContext): Promise<CommandReturn> {
        const id = context.isLegacy ? context.parsedNamedArgs.id : context.options.getInteger("id", true);

        const infraction = await this.client.prisma.infraction.delete({
            where: { id }
        });

        if (!infraction) {
            await this.deferredReply(message, `${this.emoji("error")} Could not find an infraction with that ID!`);
            return;
        }

        const user = await this.client.fetchUserSafe(infraction.userId);

        await this.deferredReply(message, {
            embeds: [this.client.infractionManager.generateInfractionDetailsEmbed(user, infraction).setTitle("Infraction Deleted")]
        });
    }
}