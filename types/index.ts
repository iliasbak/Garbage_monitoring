export enum MarkerStatus {
    Full = "FULL",
    Empty = "EMPTY",
    Mid = "MID"
}

export interface MarkerData {
    id: string;
    status: MarkerStatus;
    coordinate: {
        latitude: number;
        longitude: number;
    };
    isDeleted: boolean
}

export enum Roles {
    Admin = "ADMIN",
    User = "USER",
    Driver = "DRIVER",
  }
  