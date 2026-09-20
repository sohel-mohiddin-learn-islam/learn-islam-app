import {
  addDoc,
    collection,
      deleteDoc,
        doc,
	  getDoc,
	    getDocs,
	      orderBy,
	        query,
		  serverTimestamp,
		  } from "firebase/firestore";

		  import { db } from "./firebase";

		  const CLOUDINARY_CLOUD_NAME = "mpyzgv8c";
		  const CLOUDINARY_UPLOAD_PRESET = "learn_islam_reels";

		  export async function uploadVideo(
		    file: File,
		      userId: string
		      ): Promise<string> {
			        const uploadUrl =
				    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

				      const formData = new FormData();

				        formData.append("file", file);
					  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
					    formData.append("context", `userId=${userId}`);

					      const response = await fetch(uploadUrl, {
					          method: "POST",
						      body: formData,
						        });

							  if (!response.ok) {
							      const errorText = await response.text();
							          console.error("Cloudinary upload failed:", errorText);

								      throw new Error(
								            `Cloudinary upload failed (${response.status}).`
									        );
										  }

										    const data = await response.json();

										      if (!data.secure_url) {
										          console.error("Cloudinary response:", data);
											      throw new Error("Cloudinary did not return a video URL.");
											        }

												  return data.secure_url;
												  }

												  export async function createPost(params: {
												    userId: string;
												      userName: string;
												        userPhoto: string | null;
													  caption: string;
													    videoUrl: string;
													    }) {
													      const docRef = await addDoc(collection(db, "posts"), {
													          userId: params.userId,
														      userName: params.userName,
														          userPhoto: params.userPhoto,
															      caption: params.caption,
															          videoUrl: params.videoUrl,
																      thumbnailUrl: null,
																          createdAt: serverTimestamp(),
																	      likesCount: 0,
																	          commentsCount: 0,
																		    });

																		      return docRef.id;
																		      }

																		      export async function getPosts() {
																		        const postsQuery = query(
																			    collection(db, "posts"),
																			        orderBy("createdAt", "desc")
																				  );

																				    const snapshot = await getDocs(postsQuery);

																				      return snapshot.docs.map((item) => ({
																				          id: item.id,
																					      ...item.data(),
																					        }));
																						}

																						export async function deletePost(
																						  postId: string,
																						    userId: string,
																						      videoUrl?: string
																						      ) {
																						        const postRef = doc(db, "posts", postId);
																							  const snapshot = await getDoc(postRef);

																							    if (!snapshot.exists()) {
																							        throw new Error("Post not found.");
																								  }

																								    const post = snapshot.data();

																								      if (post.userId !== userId) {
																								          throw new Error("You can only delete your own posts.");
																									    }

																									      await deleteDoc(postRef);

																									        // Cloudinary video cleanup is not performed from the client.
																										  // The Firestore post is deleted successfully.
																										  }
