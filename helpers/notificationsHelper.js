const _ = require('lodash');

const getNotifications = (operation) => {
  const notifications = [];
  const type = operation.op[0];
  const params = operation.op[1];
  switch (type) {
    case 'comment': {
      const isRootPost = !params.parent_author;

      /** Find replies */
      if (!isRootPost) {
        const notification = {
          type: 'reply',
          parent_permlink: params.parent_permlink,
          author: params.author,
          permlink: params.permlink,
          timestamp: Date.parse(operation.timestamp) / 1000,
          block: operation.block,
        };
        notifications.push([params.parent_author, notification]);
      }

      /** Find mentions */
      const pattern = /(@[a-z][-.a-z\d]+[a-z\d])/gi;
      const content = `${params.title} ${params.body}`;
      const mentions = _
        .without(
          _
            .uniq(
              (content.match(pattern) || [])
                .join('@')
                .toLowerCase()
                .split('@'),
            )
            .filter((n) => n),
          params.author,
        )
        .slice(0, 9); // Handle maximum 10 mentions per post
      if (mentions.length) {
        mentions.forEach((mention) => {
          const notification = {
            type: 'mention',
            is_root_post: isRootPost,
            author: params.author,
            permlink: params.permlink,
            timestamp: Date.parse(operation.timestamp) / 1000,
            block: operation.block,
          };
          notifications.push([mention, notification]);
        });
      }
      break;
    }
    case 'custom_json': {
      let json = {};
      try {
        json = JSON.parse(params.json);
      } catch (err) {
        console.log('Wrong json format on custom_json', err);
      }
      switch (params.id) {
        case 'follow': {
          /** Find follow */
          if (
            json[0] === 'follow'
            && json[1].follower
            && json[1].following
            && _.has(json, '[1].what[0]')
            && json[1].what[0] === 'blog'
          ) {
            const notification = {
              type: 'follow',
              follower: json[1].follower,
              timestamp: Date.parse(operation.timestamp) / 1000,
              block: operation.block,
            };
            notifications.push([json[1].following, notification]);
          }
          /** Find reblog */
          if (json[0] === 'reblog' && json[1].account && json[1].author && json[1].permlink) {
            const notification = {
              type: 'reblog',
              account: json[1].account,
              permlink: json[1].permlink,
              timestamp: Math.round(Date.parse(operation.timestamp) / 1000),
              block: operation.block,
            };
            // console.log('Reblog', [json[1].author, JSON.stringify(notification)]);
            notifications.push([json[1].author, notification]);
          }
          break;
        }
      }
      break;
    }
    case 'account_witness_vote': {
      /** Find witness vote */
      const notification = {
        type: 'witness_vote',
        account: params.account,
        approve: params.approve,
        timestamp: Date.parse(operation.timestamp) / 1000,
        block: operation.block,
      };
      // console.log('Witness vote', [params.witness, notification]);
      notifications.push([params.witness, notification]);
      break;
    }
    case 'transfer': {
      /** Find transfer */
      const notification = {
        type: 'transfer',
        from: params.from,
        amount: params.amount,
        memo: params.memo,
        timestamp: Date.parse(operation.timestamp) / 1000,
        block: operation.block,
      };
      // console.log('Transfer', JSON.stringify([params.to, notification]));
      notifications.push([params.to, notification]);
      break;
    }
  }
  return notifications;
};

// const getgNotifications = (operation) => {
//   const notifications = [];
//   const type = operation.op[0];
//   const params = operation.op[1];
//   switch (type) {
//     case 'comment': {
//       const isRootPost = !params.parent_author;
//
//       /** Find replies */
//       if (!isRootPost) {
//         const notification = {
//           type: 'reply',
//           parent_permlink: params.parent_permlink,
//           author: params.author,
//           permlink: params.permlink,
//           timestamp: Date.parse(operation.timestamp) / 1000,
//           block: operation.block,
//         };
//         notifications.push([params.parent_author, notification]);
//       }
//
//       /** Find mentions */
//       const pattern = /(@[a-z][-.a-z\d]+[a-z\d])/gi;
//       const content = `${params.title} ${params.body}`;
//       const mentions = _
//         .without(
//           _
//             .uniq(
//               (content.match(pattern) || [])
//                 .join('@')
//                 .toLowerCase()
//                 .split('@'),
//             )
//             .filter((n) => n),
//           params.author,
//         )
//         .slice(0, 9); // Handle maximum 10 mentions per post
//       if (mentions.length) {
//         mentions.forEach((mention) => {
//           const notification = {
//             type: 'mention',
//             is_root_post: isRootPost,
//             author: params.author,
//             permlink: params.permlink,
//             timestamp: Date.parse(operation.timestamp) / 1000,
//             block: operation.block,
//           };
//           notifications.push([mention, notification]);
//         });
//       }
//       break;
//     }
//     case 'custom_json': {
//       let json = {};
//       try {
//         json = JSON.parse(params.json);
//       } catch (err) {
//         console.log('Wrong json format on custom_json', err);
//       }
//       switch (params.id) {
//         case 'follow': {
//           /** Find follow */
//           if (
//             json[0] === 'follow'
//             && json[1].follower
//             && json[1].following
//             && _.has(json, '[1].what[0]')
//             && json[1].what[0] === 'blog'
//           ) {
//             const notification = {
//               type: 'follow',
//               follower: json[1].follower,
//               timestamp: Math.round(Date.parse(operation.timestamp) / 1000),
//               block: operation.block,
//             };
//             notifications.push([json[1].following, notification]);
//           }
//           /** Find reblog */
//           if (json[0] === 'reblog' && json[1].account && json[1].author && json[1].permlink) {
//             const notification = {
//               type: 'reblog',
//               account: json[1].account,
//               permlink: json[1].permlink,
//               timestamp: Date.parse(operation.timestamp) / 1000,
//               block: operation.block,
//             };
//             // console.log('Reblog', [json[1].author, JSON.stringify(notification)]);
//             notifications.push([json[1].author, notification]);
//           }
//           break;
//         }
//       }
//       break;
//     }
//     case 'account_witness_vote': {
//       /** Find witness vote */
//       const notification = {
//         type: 'witness_vote',
//         account: params.account,
//         approve: params.approve,
//         timestamp: Date.parse(operation.timestamp) / 1000,
//         block: operation.block,
//       };
//       // console.log('Witness vote', [params.witness, notification]);
//       notifications.push([params.witness, notification]);
//       break;
//     }
//     case 'vote': {
//       /** Find downvote */
//       if (params.weight < 0) {
//         const notification = {
//           type: 'vote',
//           voter: params.voter,
//           permlink: params.permlink,
//           weight: params.weight,
//           timestamp: Date.parse(operation.timestamp) / 1000,
//           block: operation.block,
//         };
//         // console.log('Downvote', JSON.stringify([params.author, notification]));
//         notifications.push([params.author, notification]);
//       }
//       break;
//     }
//     case 'transfer': {
//       /** Find transfer */
//       const notification = {
//         type: 'transfer',
//         from: params.from,
//         amount: params.amount,
//         memo: params.memo,
//         timestamp: Date.parse(operation.timestamp) / 1000,
//         block: operation.block,
//       };
//       // console.log('Transfer', JSON.stringify([params.to, notification]));
//       notifications.push([params.to, notification]);
//       break;
//     }
//   }
//   return notifications;
// };


module.exports = { getNotifications };
