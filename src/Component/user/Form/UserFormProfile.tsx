import React from "react";
import {withTranslation} from "react-i18next";
import ItemUsername from "./Item/ItemUsername";
import ItemEmail from "./Item/ItemEmail";
import ItemNickname from "./Item/ItemNickname";
import ItemStudentId from "./Item/ItemStudentId";
import ItemPhone from "./Item/ItemPhone";
import ItemGender from "./Item/ItemGender";
import ItemRoles from "./Item/ItemRoles";
import ItemPassword from "./Item/ItemPassword";

const UserFormProfile = (props: any) => {

    return (
        <>
            <ItemUsername editable={props.editUsername}/>
            {props.needPassword && (
                <ItemPassword/>
            )}
            <ItemNickname/>
            <ItemGender/>
            <ItemStudentId/>
            <ItemPhone required={true}/>
            <ItemEmail needVerify={false}/>
            <ItemRoles/>
        </>
    )
}

export default withTranslation()(UserFormProfile)