export interface Group {
    id: string;
    name: string;
    private: boolean;
    createdBy: string;  //permission to for group admin to edit
    members: string[];
    admins: string[];
    channels: string[];
    
}