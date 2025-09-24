export interface Message{
    id: string;
    channel: string;         //points to Channel.id
    sentBy: string;         //points to user.id
    sentAt: string;         //time stamp
    content: string;
}