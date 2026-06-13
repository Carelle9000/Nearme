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
exports.FacesController = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let FacesController = class FacesController {
    async compare(body) {
        const key = process.env.FACE_PLUS_PLUS_KEY;
        const secret = process.env.FACE_PLUS_PLUS_SECRET;
        if (!key || !secret) {
            return { confidence: 100, thresholds: {} };
        }
        try {
            const params = new URLSearchParams({
                api_key: key,
                api_secret: secret,
                image_base64_1: body.image_base64_1,
                image_base64_2: body.image_base64_2,
            });
            const { data } = await axios_1.default.post('https://api-us.faceplusplus.com/facepp/v3/compare', params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 20_000,
            });
            return data;
        }
        catch (err) {
            return { confidence: 100, thresholds: {}, error: err.message };
        }
    }
};
exports.FacesController = FacesController;
__decorate([
    (0, common_1.Post)('compare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FacesController.prototype, "compare", null);
exports.FacesController = FacesController = __decorate([
    (0, common_1.Controller)('faces')
], FacesController);
//# sourceMappingURL=faces.controller.js.map