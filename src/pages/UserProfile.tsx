
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast"; // Updated import path
import { supabase } from "@/integrations/supabase/client";
import { User, Key, Save } from "lucide-react";

const profileFormSchema = z.object({
  fullName: z.string().min(3, "Le nom complet doit contenir au moins 3 caractères"),
  phoneNumber: z.string().min(9, "Le numéro de téléphone doit contenir au moins 9 chiffres").optional()
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string().min(6, "La confirmation du mot de passe doit contenir au moins 6 caractères")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"]
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const UserProfile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: ""
    }
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    const getUserProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Accès refusé",
          description: "Vous devez être connecté pour accéder à cette page.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error("Erreur lors de la récupération du profil:", error);
          toast({
            title: "Erreur",
            description: "Impossible de récupérer vos informations.",
            variant: "destructive",
          });
        } else if (data) {
          setUser({
            id: data.id,
            email: data.email,
            fullName: data.name,
            phoneNumber: data.phone
          });
          
          profileForm.reset({
            fullName: data.name || "",
            phoneNumber: data.phone || ""
          });
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getUserProfile();
  }, [navigate, toast, profileForm]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          name: data.fullName,
          phone: data.phoneNumber 
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour l'état local
      setUser({
        ...user,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber
      });
      
      // Mettre à jour également les métadonnées utilisateur Supabase
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { 
          full_name: data.fullName,
          phone: data.phoneNumber 
        }
      });
      
      if (metadataError) {
        console.warn("Avertissement: Impossible de mettre à jour les métadonnées utilisateur", metadataError);
      }
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès.",
      });
    } catch (error: any) {
      console.error("Erreur de mise à jour:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour de votre profil.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });
      
      if (error) {
        throw error;
      }
      
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été changé avec succès.",
      });
    } catch (error: any) {
      console.error("Erreur de changement de mot de passe:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors du changement de votre mot de passe.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-t-4 border-t-restaurant-red border-restaurant-purple rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Mon Profil</h1>
      
      <div className="max-w-2xl mx-auto grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" /> 
              Informations Personnelles
            </CardTitle>
            <CardDescription>
              Mettez à jour vos informations personnelles ici.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre nom complet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre numéro de téléphone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-2">
                  <Button type="submit" disabled={isUpdating}>
                    <Save className="mr-2 h-4 w-4" />
                    {isUpdating ? "Mise à jour..." : "Enregistrer les modifications"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5" /> 
              Changer de Mot de Passe
            </CardTitle>
            <CardDescription>
              Mettez à jour votre mot de passe pour sécuriser votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe actuel</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-2">
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? "Mise à jour..." : "Changer le mot de passe"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => navigate("/")}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
