const faunadb = require('faunadb');
const q = faunadb.query;
const client = new faunadb.Client({ secret: process.env.FN_KEY });

exports.handler = async (event, context) => {
    const path = event.path.replace(/\.netlify\/functions\/[^/]+/, '');
    const segments = path.split('/').filter(Boolean);
    
    switch (event.httpMethod) {
        case 'POST':
			let data = JSON.parse(event.body).data;
			data.tagsRef = [];
			for (var tag of data.tag) {
				data.tagsRef.push(q.Ref(q.Collection('Tags'), tag));
			}
            return client
				.query(
					q.Create(
						q.Collection('Links'),
						{ 
							data: { 
								'url': data.url,
								'title': data.title,
								'tagRef': data.tagsRef
							} 
						},
					)
				)
				.then(response => {
					return {
						statusCode: 200,
						body: JSON.stringify(response)
					}
				})
				.catch(error => {
					return {
						statusCode: 400,
						body: JSON.stringify(error)
					}
				});
        case 'GET':
			if (segments[0] === 'tags') {
				return client
					.query(
						q.Map(
							q.Paginate(
								q.Match(
									q.Index('all_Tags')
								)
							),
							q.Lambda(
								x => q.Get(x)
							)
						)
					)
					.then(response => {
						return {
							statusCode: 200,
							body: JSON.stringify(response)
						}
					})
					.catch(error => {
						return {
							statusCode: 400,
							body: JSON.stringify(error)
						}
					});
			} else {
				const tagId = event.queryStringParameters.tagid;
				return client
					.query(
						q.Map(
							q.Paginate(
								q.Match(
									q.Index('Links_by_tagRef'),
									q.Ref(q.Collection('Tags'), tagId)
								)
							),
							q.Lambda("link", q.Get(q.Var("link")))
						)
					)
					.then(response => {
						return {
							statusCode: 200,
							body: JSON.stringify(response)
						}
					})
					.catch(error => {
						return {
							statusCode: 400,
							body: JSON.stringify(error)
						}
					});
			}
        case 'PUT':
            console.log('PUT');
        case 'DELETE':
            console.log('DELETE');
        default:
            console.log('DEFAULT');
	}
}