define(function (require, exports, module) {

    module.exports = {
        pc_config: { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] },
        pc_constraints: { "optional": [{ "DtlsSrtpKeyAgreement": true }] },
        sdpConstraints: {
            mandatory: {
                OfferToReceiveAudio: true,
                OfferToReceiveVideo: true
            }
        }
    }
    
})