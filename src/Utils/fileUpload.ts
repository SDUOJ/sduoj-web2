import CApi from "Utils/API/c-api"
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
                            callback(value)
                            return Promise.resolve()
                        } else {
                            formData.append("files", file);
                            num += 1;
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
            if (num !== 0) {
                CApi.uploadFile(formData).then((data: any) => {
                    data.map((value: any) => {
                        callback(value)
                        return undefined
                    })
                })
            }
        })
    })
}