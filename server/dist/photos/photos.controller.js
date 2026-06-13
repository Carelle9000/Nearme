"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotosController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const fs = require("fs");
const path = require("path");
const uuid_1 = require("uuid");
const mime_types_1 = require("mime-types");
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
let PhotosController = class PhotosController {
    async upload(req, body) {
        if (!body.data || !body.ext) {
            throw new common_1.HttpException('data and ext required', common_1.HttpStatus.BAD_REQUEST);
        }
        const userId = req.userId;
        const dir = path.join(UPLOADS_DIR, userId);
        fs.mkdirSync(dir, { recursive: true });
        const filename = `${(0, uuid_1.v4)()}.${body.ext.replace(/[^a-zA-Z0-9]/g, '')}`;
        const filepath = path.join(dir, filename);
        const buffer = Buffer.from(body.data, 'base64');
        fs.writeFileSync(filepath, buffer);
        return { path: `/photos/${userId}/${filename}` };
    }
    servePhoto(userId, filename, res) {
        if (userId.includes('/') ||
            userId.includes('..') ||
            filename.includes('/') ||
            filename.includes('..')) {
            throw new common_1.HttpException('Bad request', common_1.HttpStatus.BAD_REQUEST);
        }
        const filepath = path.join(UPLOADS_DIR, userId, filename);
        if (!fs.existsSync(filepath)) {
            throw new common_1.HttpException('Not found', common_1.HttpStatus.NOT_FOUND);
        }
        const mime = (0, mime_types_1.lookup)(filename) || 'application/octet-stream';
        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.sendFile(filepath);
    }
};
exports.PhotosController = PhotosController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PhotosController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)(':userId/:filename'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('filename')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PhotosController.prototype, "servePhoto", null);
exports.PhotosController = PhotosController = __decorate([
    (0, common_1.Controller)('photos')
], PhotosController);
//# sourceMappingURL=photos.controller.js.map