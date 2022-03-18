# metaframe-project

Metaframe allows anyone who has the extension installed to go to any page on the web, select some text, and leave a comment which will be posted on the Solona blockchain. Metaframe uses websockets so that when someone comments on a page you are viewing it shows up in real-time.

Instead of using a fixed moderation system, metaframe defines a domain-specific language for writing a moderation program, which can communicate with a program on the solana block chain to allow comments to be moderated, voted on, flagged, and removed by almost any criteria. Two example moderation programs are provided, a voting program which stores votes as solana accounts, and scores comments based on how many votes they have received and hides comments with > 10 downvotes. The other provided demo moderation program uses text processing to filter out any comment that appears to be discussing elevators. 

The dsl allows moderation programs to be ran in javascript in their own isolated environment with a restricted set of methods, which prevents them from running arbitrary javascript on a users browser, while at the same time allowing for a wide range of possible moderation algorithims. Using a dsl also opens up the possibility of processing moderation programs in rust.

The vision of metaframe is to:

1. Provide a way to read comments on any article, replacing the experience of someone reading whatever a news organization decides to show them with the experience of someone interacting with a broad range of perspectives on any content they are viewing.
2. Provide decentralized moderation platform that removes the catch-22 of a social platform either being responsible for every bit of content they dont moderate, or on the other hand being held responsible any time they decide some content needs to be removed. Decentralization avoids this problem by offloading the responsibility for moderation to a multitude of other communities and authorities.

To run it requires your hosts file to point metaframe.io to localhost, and to run an https server in the app/public directory, after running npm and webpack and deploying the anchor code to localhost. Your browser should also load the public folder as an unpacked extension. Moderation programs are currently chosen by clicking the metaframe logo in the google chrome navbar, and entering the url for the idl.json file of that moderation program. 
