import { Role } from "../Type/Iuser";

export default function judgeAuth(roles: Role[], minRole: Role): boolean {
    return (roles.includes(minRole) || roles.includes(minRole-1) || roles.includes(minRole-2))
}
