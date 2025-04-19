
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast"; 
import { supabase } from "@/integrations/supabase/client";
import { User, Key, Save, ArrowLeft } from "lucide-react";
import { useUserAuth } from "@/hooks/use-user-auth";
import { Link } from "react-router-dom";

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
  const { userData, isLoggedIn, updateUserData, isLoading } = useUserAuth();
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

  // Rediriger si non connecté
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      toast({
        title: "Accès refusé",
        description: "Vous devez être connecté pour accéder à cette page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isLoggedIn, isLoading, navigate, toast]);

  // Mettre à jour le formulaire quand les données utilisateur sont disponibles
  useEffect(() => {
    if (userData) {
      console.log("Réinitialisation du formulaire avec les données utilisateur:", userData);
      profileForm.reset({
        fullName: userData.fullName || "",
        phoneNumber: userData.phoneNumber || ""
      });
    }
  }, [userData, profileForm]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    console.log("Soumission du formulaire de profil:", data);
    if (!userData) return;
    
    setIsUpdating(true);
    
    try {
      const success = await updateUserData({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber
      });
      
      if (!success) {
        console.error("Échec de la mise à jour du profil");
      } else {
        console.log("Profil mis à jour avec succès");
      }
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
      // Pour des raisons de sécurité, nous devons d'abord vérifier l'ancien mot de passe
      // en essayant de se reconnecter avec celui-ci
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userData?.email || "",
        password: data.currentPassword,
      });
      
      if (authError) {
        throw new Error("Le mot de passe actuel est incorrect");
      }
      
      // Si l'authentification réussit, nous pouvons mettre à jour le mot de passe
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

  if (!isLoggedIn || !userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-restaurant-purple mb-4">Accès non autorisé</h1>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder à votre profil.
          </p>
          <Link to="/">
            <Button className="w-full bg-restaurant-purple hover:bg-restaurant-purple/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
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
