import { User } from "discord.js";
import path from "path";
import fs from "fs/promises";
import Punishment from "../models/Punishment";
import { formatDistanceToNowStrict, format } from "date-fns";
import { convert } from "../commands/moderation/HistoryCommand";
import PunishmentType from "../types/PunishmentType";
import { v4 as uuid } from 'uuid';

export default class ModerationHistoryGenerator {
    version = require(path.resolve(__dirname, '../../package.json')).version;
    tmpFilePath: string | undefined = undefined;

    constructor(protected user: User, protected guild: { id: string, name: string }) {

    }

    async generate(sendDM: boolean = false) {
        const punishments = await Punishment.find({
            guild_id: this.guild.id,
            user_id: this.user.id,
        }).sort({ createdAt: -1 });
    
        const tmpFilePath = path.join(__dirname, '../../tmp', `history-${uuid()}.txt`);
        this.tmpFilePath = tmpFilePath;

        const tmpFile = await fs.open(tmpFilePath, 'a+');
    
        await tmpFile.appendFile(`Moderation history of ${this.user.tag} (ID: ${this.user.id}) in ${this.guild.name}\n`);
        await tmpFile.appendFile(`* ${punishments.length} total entries\n`);
        await tmpFile.appendFile(`* Seeing something unexpected? Contact the moderators of ${this.guild.name}\n`);
        await tmpFile.appendFile(`* Format: [Serial Number] - [Case ID] - [Type] - [Reason] - [Date]\n\n====================================================================\n\n`);
    
        let i = 1;

        for await (const punishment of punishments) {
            await tmpFile.appendFile(`${i}. ${punishment.id} - ${convert(punishment.type as PunishmentType)} - ${punishment.reason ?? '*No Reason Provided*'} - ${punishment.createdAt} (${formatDistanceToNowStrict(punishment.createdAt, { addSuffix: true })})\n`);
            i++;
        }
    
        if (punishments.length === 0) {
            await tmpFile.appendFile(`No record available.`);
        }
    
        await tmpFile.appendFile(`\n\nGenerated by SudoBot/${this.version} on ${format(new Date(), "dd MMMM yyyy, h:mm a O")}`);
        await tmpFile.close();
    
        let dmStatus = false;
    
        if (sendDM) {
            try {
                await this.user.send({
                    content: `We've generated your moderation history. Download the attached text file to see them. There are ${punishments.length} record(s) available.`,
                    files: [
                        {
                            name: `history-${this.user.id}.txt`,
                            attachment: tmpFilePath
                        }
                    ],
                });
    
                dmStatus = true;
            }
            catch (e) {
                console.log(e);
            }
        }

        return { dmStatus, tmpFilePath, size: punishments.length };
    }

    async removeTempFile() {
        if (this.tmpFilePath)
            return await fs.rm(this.tmpFilePath);
    }
}