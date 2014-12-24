exports.addContext = function (request, reply) {
    if (request.response.source && request.response.source.context) {
        if (request.auth.credentials.userid) {
            request.response.source.context = {
                userid    : request.auth.credentials.userid,
                fullName  : request.auth.credentials.fullName,
                avatar    : request.auth.credentials.avatar,
                moderator : request.auth.credentials.moderator,
                admin     : request.auth.credentials.admin
            };
        }
    }
    reply();
};