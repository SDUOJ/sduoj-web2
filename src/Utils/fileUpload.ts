import CApi from "Utils/API/c-api"
import apiAddress from "./API/apiAddress";
import md5 from "js-md5";

export const fileUpload = (files: File[], callback: any) => {
    let formData = new FormData();
    let num = 0
    let pros: Promise<any>[] = []
    let md5Set : Promise<any>[] = []
    files.forEach((file) => {
        md5Set.push(
            file.arrayBuffer().then(((value) => {
                let code = md5(value)
                pros.push(
                    CApi.getFileByMD5({md5: code}).then((value: any) => {
                        if (value !== null) {
                            callback(apiAddress().CLIENT_SERVER + "/api/filesys/download/" + value.id + "/" + value.name)
                            return Promise.resolve()
                        } else {
                            formData.append("files", file);
                            num += 1;
                            console.log("upload - md5", num)
                            return Promise.resolve()
                        }
                    })
                )
                return Promise.resolve()
            }))
        )
    });

    Promise.all(md5Set).then(() => {
        Promise.all(pros).then(()=>{
            console.log("upload", num)
            if (num != 0) {
                CApi.uploadFile(formData).then((data: any) => {
                    data.map((value: any) => {
                        callback(apiAddress().CLIENT_SERVER + "/api/filesys/download/" + value.id + "/" + value.name)
                    })
                })
            }
        })
    })
}