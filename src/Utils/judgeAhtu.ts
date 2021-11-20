import {Role} from "../Type/Iuser";


/**
 * 判断用户当前权限是否满足使用条件
 * @param roles 用户权限
 * @param minRole 最小限制权限
 */
export default function judgeAuth(roles: Role[], minRole: Role[]): boolean {
    let ok = false;
    roles.map(v => {
        if (minRole.includes(v)) ok = true;
    })
    return ok;
}
