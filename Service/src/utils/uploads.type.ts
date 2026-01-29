/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
export default class UploadsType {
    static imageFileSize: number = 1024 * 1024 * 5;  // 5M
    static fileFileSize: number = 1024 * 1024 * 5;  // 5M
    static Image(file: any, callback: any): void {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            callback(0);
        }
        callback(1);
    };

    static File(file: any, callback: any): void {
        const allowedMimeTypes = [
            'application/pdf', // PDF
            'application/msword', // DOC
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
            'application/vnd.ms-excel', // XLS
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
            'text/plain', // TXT
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            callback(1);
        } else {
            callback(0);
        };
        
    };

};