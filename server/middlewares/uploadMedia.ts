
import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage()
});

export const uploadMedia = upload.single("media");
