"use client";

import Loading from "@/app/loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { useSessionWithRedux } from "@/hooks/useSessionWithRedux";
import { dateFormat } from "@/lib/utils";
import {
  completeProfileSchema,
  CompleteProfileValues,
} from "@/lib/validators/completeProfile";
import { setUserProfile } from "@/store/slice/userProfileSlice";
import { RootState } from "@/store/store";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { AtSign, Calendar, Camera, Edit3, Mail, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector(
    (state: RootState) => state.userProfile.userProfile
  );

  const { session, status, updateSession } = useSessionWithRedux();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<CompleteProfileValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      username: "",
      name: "",
      avatar: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/profile");
        const user = res.data.user;

        if (user) {
          dispatch(setUserProfile(user));
          form.reset({
            name: user.name || "",
            username: user.username || "",
            bio: user.bio || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };
    
    if (userProfile === null) {
      fetchUser();
    }
  }, [status]);

  const onSubmit = async (data: CompleteProfileValues) => {
    if(!userProfile) return;
    const updatedProfile = {
      ...{ id: userProfile.id, email: userProfile.email },
      ...data,
      profileCompleted: true,
    };
    dispatch(setUserProfile(updatedProfile));
    setIsEditing(false);
    let body = {
      ...data,
      action: "COMPLETE_PROFILE",
    };
    try {
      const res = await axios.post("/api/profile", body, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.status === 200) {
        await updateSession();
        toast.success("Profile saved!");
        router.refresh();
      } else {
        const errorMessage = res.data?.error || "Something went wrong.";
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to update profile.");
    }
  };

  if (userProfile === null) {
    return <p>Loading profile...</p>;
  }
  if (status !== "authenticated") return <Loading />;

  const user = session?.user as any;

  return (
    <div className="min-h-screen pt-16 bg-black/90">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full filter blur-[80px]"></div>
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-cyan-500/20 rounded-full filter blur-[80px]"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <Card className="max-w-2xl mx-auto bg-background/50 backdrop-blur-sm border-purple-500/20">
          {/* Profile Header */}
          <div className="relative h-32 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-t-lg">
            <div className="absolute -bottom-16 left-8">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-background">
                  <AvatarImage src={userProfile.avatar} width={40}/>
                  <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-purple-500 text-2xl text-white">
                    {userProfile.name
                      ? userProfile.name
                          .split(" ")
                          .map((n: any) => n[0])
                          .join("")
                      : ""}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <button className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="icon"
                className="absolute top-4 right-4 rounded-full"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Profile Content */}
          <div className="pt-20 p-8">
            {!userProfile.profileCompleted && (
              <div className="mb-6 p-4 bg-purple-500/10 rounded-lg">
                <h3 className="text-lg font-medium mb-2">
                  Complete Your Profile
                </h3>
                <p className="text-muted-foreground">
                  Please complete your Profile to access all features of
                  VaibTalk.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-2xl font-bold">
                    {!isEditing && userProfile.name}
                  </h2>
                  <Badge variant="outline" className="bg-muted/40">
                    {userProfile.profileCompleted
                      ? "Profile Complete"
                      : "Incomplete Profile"}
                  </Badge>
                </div>

                {isEditing ? (
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-muted/40"
                                placeholder="Your full name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-muted/40"
                                placeholder="Choose a unique username"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-muted/40"
                                placeholder="Tell us about yourself"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3">
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div className="space-y-3">
                    <p className="text-muted-foreground">{userProfile.bio}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {userProfile.email}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AtSign className="w-4 h-4" />
                        {userProfile.username}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Joined{" "}
                        {dateFormat(
                          new Date(userProfile.createdAt ?? ""),
                          "MMMM yyyy"
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
